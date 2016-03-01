<?php include ($directory."/partials/login-header.php"); ?>
<main id="login-body" itemscope itemprop="mainContentOfPage" itemtype="http://schema.org/WebPageElement">
  <header class="row column">
    <h1 itemprop="headline"><?php print $title; ?></h1>
  </header>
  <div id="main-content" class="row">
    <div class="medium-6 small-centered columns login-form-box-wrapper">
      <div class="login-form-box">
        <div class="row column">
          <?php print $messages; ?>
        </div>
        <div class="row">
          <?php print render($page['content']); ?>
        </div>
      </div>
    </div>
  </div>
</main>
<?php include ($directory."/partials/login-footer.php"); ?>