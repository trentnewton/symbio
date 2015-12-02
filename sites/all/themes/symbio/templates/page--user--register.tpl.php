<?php include ($directory."/partials/login-header.php"); ?>
<main id="login-body" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
  <div class="row">
    <div class="medium-6 small-centered columns">
      <div class="text-center">
        <h1><?php print $title; ?></h1>
      </div>
    </div>
  </div> 
  <div class="row">
    <div class="medium-6 small-centered columns login-form-box-wrapper">
      <div class="login-form-box text-center">
        <div class="row">
          <div class="column">
            <?php print $messages; ?>
          </div>
        </div>
        <div class="row">
          <div class="column">
            <?php print render($page['content']); ?>
          </div>
        </div>
      </div>
    </div>
  </div>
</main>
<?php include ($directory."/partials/login-footer.php"); ?>