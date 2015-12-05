<div class="off-canvas-wrap docs-wrap" data-offcanvas="">
  <div class="inner-wrap">
    <main id="main-wrapper">
      <?php include ($directory."/partials/header.php"); ?>
    <?php if(!drupal_is_front_page()):?>
      <section id="masthead">
        <div class="row">
          <div class="column">
            <?php if ($page['masthead']): ?>
            <div class="page-title" data-sr="enter bottom">
              <?php print render($page['masthead']); ?>
            </div>
            <?php endif; ?>
        <?php if ($page['content']): ?>
        <?php print render($page['content']); ?>
        <?php endif; ?>
      <?php if ($messages || $tabs) : ?>
            <div class="m-t-30">
              <?php print $messages; ?>
              <?php if ($tabs): ?>
              <div class="tabs">
                <?php print render($tabs); ?>
              </div>
              <?php endif; ?>
            </div>
          </div>
        </article>
      </div>
      <?php else : ?>
          </div>
        </div>
      </section>
      <?php endif; ?>
    <?php endif;?>
    </main>
    <?php include ($directory."/partials/footer.php"); ?>
    <a class="exit-off-canvas"></a>
  </div>
</div>